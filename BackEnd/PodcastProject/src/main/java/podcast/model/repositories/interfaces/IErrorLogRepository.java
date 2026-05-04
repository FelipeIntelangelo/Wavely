package podcast.model.repositories.interfaces;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import podcast.model.entities.ErrorLog;

@Repository
public interface IErrorLogRepository extends JpaRepository<ErrorLog, Long> {
}
